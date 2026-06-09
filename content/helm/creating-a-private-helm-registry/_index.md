+++
title = "Creating a Private Helm Registry"
weight = 81
+++

Before creating a registry, you need to [register to Repsy](https://repsy.io) with a username, password, and e-mail. When you register, Repsy will create a `default` registry for you.
In the Helm section, you can create new registries and change the settings for existing ones whenever you need.

{{< steps >}}

### Sign up or log in

Go to [repsy.io](https://repsy.io) and create an account, or log in if you already have one.

### Create a Helm repository

In the Repsy dashboard, navigate to the **Helm** section and create a new repository. Give it a name and choose whether it should be public or private.

### Note your repository URLs

Once the repository is created, you will see two endpoint URLs that you can use depending on your preferred protocol:

**Classic (ChartMuseum-compatible)**
```
https://repo.repsy.io/helm/<username>/<repo-name>
```

**OCI registry**
```
oci://repo.repsy.io/helm/<username>/<repo-name>
```

Replace `<username>` and `<repo-name>` with your Repsy username and the name you chose for the repository.

{{< /steps >}}
